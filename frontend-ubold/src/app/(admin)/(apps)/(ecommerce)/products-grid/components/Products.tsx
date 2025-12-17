import Image from 'next/image'
import Link from 'next/link'
import { Badge, Button, Card, CardBody, CardFooter, CardTitle, Col, Row } from 'react-bootstrap'
import { TbBasket } from 'react-icons/tb'

import Rating from '@/components/Rating'
import { productData } from '@/app/(admin)/(apps)/(ecommerce)/products/data'
import { currency } from '@/helpers'

const Products = () => {
  return (
    <Row className="row-cols-xxl-4 row-cols-lg-3 row-cols-sm-2 row-col-1 g-2">
      {productData.map((product, index) => (
        <Col className="col" key={product.code || index}>
          <Card className="h-100 mb-2">
            {product.status === 'published' && (
              <Badge
                bg="success"
                className='badge-label fs-base rounded position-absolute top-0 start-0 m-3'>
                {product.status}
              </Badge>
            )}
            <CardBody className="pb-0">
              <div className="p-3">
                <Image height={333} width={333} src={product.image} alt={product.name} className="img-fluid" />
              </div>
              <CardTitle className="fs-sm lh-base mb-2">
                <Link href={product.url || '#'} className="link-reset">
                  {product.name}
                </Link>
              </CardTitle>
              <div className="mb-2">
                <p className="text-muted mb-0 fs-xxs">by: {product.brand}</p>
                <p className="text-muted mb-0 fs-xxs">SKU: {product.code}</p>
              </div>
              <div>
                <span className="text-warning">
                  <Rating rating={product.rating} />
                </span>
                <span className="ms-1">
                  <Link href="/reviews" className="link-reset fw-semibold">
                    ({product.reviews})
                  </Link>
                </span>
              </div>
            </CardBody>

            <CardFooter className="bg-transparent d-flex justify-content-between">
              <div className="d-flex flex-column justify-content-start align-items-start gap-1">
                <h5 className="text-success d-flex align-items-center gap-2 mb-0">
                  {currency}{product.price.toFixed(2)}
                </h5>
                <small className="text-muted">Stock: {product.stock} | Sold: {product.sold}</small>
              </div>
              <Button size="sm" variant="primary" className="btn-icon" href="#!">
                <TbBasket className="fs-lg" />
              </Button>
            </CardFooter>
          </Card>
        </Col>
      ))}
    </Row>
  )
}

export default Products
